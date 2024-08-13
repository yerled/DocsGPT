import { Fragment, useState } from 'react';
import DocsGPT3 from './assets/cute_docsgpt3.svg';
import { useTranslation } from 'react-i18next';
import Dropdown from './components/Dropdown';
import { useDispatch, useSelector } from 'react-redux';
import { selectModel, setModel } from './preferences/preferenceSlice';
export default function Hero({
  handleQuestion,
}: {
  handleQuestion: ({
    question,
    isRetry,
  }: {
    question: string;
    isRetry?: boolean;
  }) => void;
}) {
  const dispatch = useDispatch();
  const model = useSelector(selectModel);
  const { t } = useTranslation();
  const demos = t('demo', { returnObjects: true }) as Array<{
    header: string;
    query: string;
  }>;
  return (
    <div
      className={`mb-1 mt-16 flex w-full flex-col justify-end text-black-1000 dark:text-bright-gray sm:w-full md:mb-10 lg:mt-6`}
    >
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="flex items-center">
          <span className="p-0 text-4xl font-semibold">DocsGPT</span>
          <img className="mb-1 inline w-14 p-0" src={DocsGPT3} alt="docsgpt" />
        </div>
        <Dropdown
          options={[
            { label: 'model 1', value: 'model 1' },
            { label: 'model 2', value: 'model 2' },
          ]}
          selectedValue={model}
          onSelect={(o: any) => {
            dispatch(setModel(o.value));
          }}
        />
        <div className="mb-4 flex flex-col items-center justify-center dark:text-white"></div>
      </div>
      <div className="mb-16 grid w-full grid-cols-1 items-center gap-4 self-center text-xs sm:w-auto sm:gap-6  md:mb-0 md:text-sm lg:grid-cols-2">
        {demos?.map(
          (demo: { header: string; query: string }, key: number) =>
            demo.header &&
            demo.query && (
              <Fragment key={key}>
                <button
                  onClick={() => handleQuestion({ question: demo.query })}
                  className="w-full rounded-full border-2 border-silver px-6 py-4 text-left hover:border-gray-4000 dark:hover:border-gray-3000 xl:min-w-[24vw]"
                >
                  <p className="mb-1 font-semibold text-black dark:text-silver">
                    {demo.header}
                  </p>
                  <span className="text-gray-400">{demo.query}</span>
                </button>
              </Fragment>
            ),
        )}
      </div>
    </div>
  );
}
